import { Fragment } from 'react';
import { ChevronRight, Home } from 'lucide-react';

const BreadCrumb = ({ path, folders = [], onNavigate }) => {
  const generateBreadcrumbs = () => {
    if (!path || path === '/') {
      return [{ name: 'Home', path: '/', id: null }];
    }

    const pathParts = path.split('/').filter(part => part);
    const breadcrumbs = [{ name: 'Home', path: '/', id: null }];

    let currentPath = '';
    pathParts.forEach((part) => {
      currentPath += `/${part}`;
      const folder = folders.find(f => f.path === currentPath);
      breadcrumbs.push({
        name: part,
        path: currentPath,
        id: folder?.id || null
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleClick = (breadcrumb) => {
    if (onNavigate) {
      onNavigate(breadcrumb.id, breadcrumb.path);
    }
  };

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={breadcrumb.path}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          
          <button
            onClick={() => handleClick(breadcrumb)}
            className={`flex items-center space-x-1 hover:text-primary-600 transition-colors ${
              index === breadcrumbs.length - 1 
                ? 'text-gray-900 font-medium cursor-default' 
                : 'text-gray-600 hover:text-primary-600'
            }`}
            disabled={index === breadcrumbs.length - 1}
          >
            {index === 0 && <Home className="h-4 w-4" />}
            <span>{breadcrumb.name}</span>
          </button>
        </Fragment>
      ))}
    </nav>
  );
};

export default BreadCrumb;